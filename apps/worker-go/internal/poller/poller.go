package poller

import (
	"context"
	"log"
	"time"

	"github.com/gosnmp/gosnmp"
)

// Device represents a radio device to be polled.
type Device struct {
	ID        string
	Name      string
	IPAddress string
	Community string
	Version   gosnmp.SnmpVersion
}

// Metrics holds the collected SNMP data for a device.
type Metrics struct {
	DeviceID    string
	CollectedAt time.Time
	SignalDBm   *float64
	NoiseDBm    *float64
	TxPowerDBm  *float64
	FrequencyMhz *float64
	LinkUptimeSec *int64
}

// Poll performs a single SNMP poll on the given device.
func Poll(ctx context.Context, device Device) (*Metrics, error) {
	snmp := &gosnmp.GoSNMP{
		Target:    device.IPAddress,
		Port:      161,
		Community: device.Community,
		Version:   device.Version,
		Timeout:   time.Duration(5) * time.Second,
		Retries:   2,
		MaxOids:   gosnmp.MaxOids,
	}

	if err := snmp.Connect(); err != nil {
		return nil, err
	}
	defer func() {
		if err := snmp.Conn.Close(); err != nil {
			log.Printf("[poller] error closing SNMP conn for %s: %v", device.IPAddress, err)
		}
	}()

	metrics := &Metrics{
		DeviceID:    device.ID,
		CollectedAt: time.Now().UTC(),
	}

	log.Printf("[poller] polled device %s (%s)", device.Name, device.IPAddress)
	return metrics, nil
}
